import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Lock, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { processPdfFile } from "@/lib/pdf-parser";

interface UploadWidgetProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function UploadWidget({ onClose, showCloseButton = true }: UploadWidgetProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleProcessStatement = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to process",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Mock upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Process PDF file
      const { base64 } = await processPdfFile(selectedFile);

      // Send to server
      const response = await apiRequest('POST', '/api/upload-statement', {
        pdfContent: base64
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      
      // Show success toast
      toast({
        title: "Statement Processed Successfully",
        description: `Extracted ${result.transactions.length} transactions`,
      });

      // Reset the form
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Close the widget if provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-3 bg-white rounded-lg shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upload Monthly Statement</h2>
          {showCloseButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="space-y-3">
            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                <span>Upload a PDF file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  accept=".pdf" 
                  className="sr-only"
                  onChange={handleFileInputChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              Supported file: PDF up to 10MB
            </p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-3 px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileUp className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {selectedFile.name}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 flex justify-between">
          <div className="text-sm text-gray-500 flex items-center">
            <Lock className="mr-1 h-3 w-3" /> Your data is encrypted and secure
          </div>
          <Button 
            onClick={handleProcessStatement}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            {isUploading ? 'Processing...' : 'Process Statement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
