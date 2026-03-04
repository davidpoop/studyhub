'use client';

import { FileText, Download } from 'lucide-react';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <FileText className="w-4 h-4" /> PDF Document
        </span>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
      <iframe
        src={`${url}#toolbar=0`}
        className="w-full h-[700px]"
        title="PDF Viewer"
      />
    </div>
  );
}
