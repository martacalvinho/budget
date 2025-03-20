-- Get table and view information
WITH table_comments AS (
    SELECT 
        c.oid, 
        ns.nspname as schema,
        c.relname as name,
        c.relkind,
        pg_catalog.obj_description(c.oid, 'pg_class') as comment
    FROM pg_catalog.pg_class c
    LEFT JOIN pg_catalog.pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
),
column_info AS (
    SELECT 
        a.attrelid,
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        a.attnotnull as is_not_null,
        pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_value,
        col_description(a.attrelid, a.attnum) as comment
    FROM pg_catalog.pg_attribute a
    LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
    WHERE a.attnum > 0 
    AND NOT a.attisdropped
),
constraints AS (
    SELECT
        conrelid,
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
    FROM pg_constraint
    WHERE contype IN ('f', 'p', 'u')
),
policies AS (
    SELECT 
        pol.polrelid,
        pol.polname as policy_name,
        pg_policies.cmd as operation,
        pg_policies.qual as using_expression,
        pg_policies.with_check as with_check_expression
    FROM pg_policy pol
    JOIN pg_policies ON pol.polname = pg_policies.policyname
    WHERE pg_policies.schemaname = 'public'
),
indexes AS (
    SELECT
        i.indrelid,
        c.relname as index_name,
        pg_get_indexdef(i.indexrelid) as index_definition
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
)
SELECT json_build_object(
    'schema_version', '1.0',
    'tables', (
        SELECT json_agg(json_build_object(
            'name', tc.name,
            'type', CASE 
                WHEN tc.relkind = 'r' THEN 'table'
                WHEN tc.relkind = 'v' THEN 'view'
                ELSE tc.relkind::text
            END,
            'comment', tc.comment,
            'columns', (
                SELECT json_agg(json_build_object(
                    'name', ci.column_name,
                    'type', ci.data_type,
                    'not_null', ci.is_not_null,
                    'default', ci.default_value,
                    'comment', ci.comment
                ) ORDER BY ci.column_name)
                FROM column_info ci
                WHERE ci.attrelid = tc.oid
            ),
            'constraints', (
                SELECT json_agg(json_build_object(
                    'name', c.constraint_name,
                    'definition', c.constraint_definition
                ))
                FROM constraints c
                WHERE c.conrelid = tc.oid
            ),
            'policies', (
                SELECT json_agg(json_build_object(
                    'name', p.policy_name,
                    'operation', p.operation,
                    'using', p.using_expression,
                    'with_check', p.with_check_expression
                ))
                FROM policies p
                WHERE p.polrelid = tc.oid
            ),
            'indexes', (
                SELECT json_agg(json_build_object(
                    'name', i.index_name,
                    'definition', i.index_definition
                ))
                FROM indexes i
                WHERE i.indrelid = tc.oid
            )
        ))
        FROM table_comments tc
        WHERE tc.schema = 'public'
    )
);
