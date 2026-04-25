-- Create a storage bucket for asset documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-documents', 'asset-documents', false);

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own asset documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own asset documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own asset documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'asset-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);