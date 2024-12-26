import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { parseCSV } from '../../utils/statementParser';
import { parsePDF } from '../../utils/pdfStatementParser';
import type { Transaction } from '../../types/transactions';

interface StatementUploaderProps {
  onTransactionsFound: (transactions: Transaction[]) => void;
}

const StatementUploader: React.FC<StatementUploaderProps> = ({ onTransactionsFound }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a CSV or PDF file');
      return;
    }

    setLoading(true);
    try {
      if (file.name.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const transactions = await parsePDF(buffer);
        onTransactionsFound(transactions);
        toast.success(`Found ${transactions.length} transactions`);
      } else {
        const text = await file.text();
        const transactions = await parseCSV(text);
        onTransactionsFound(transactions);
        toast.success(`Found ${transactions.length} transactions`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse bank statement');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Bank Statement</h2>
      
      <div
        className={`p-8 border-2 border-dashed rounded-lg ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Upload bank statement
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Drop your PDF or CSV bank statement here or click to upload
          </p>
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
              <p className="text-gray-600">Processing statement...</p>
            </div>
          ) : (
            <>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                <FileText className="h-5 w-5 mr-2" />
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept=".csv, .pdf"
                  onChange={handleFileInput}
                />
              </label>
              <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 mr-1" />
                Only CSV and PDF files are supported
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatementUploader;