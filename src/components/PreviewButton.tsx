import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useUISettings } from '@/hooks/useUISettings';

interface PreviewButtonProps {
  onPreviewChange?: (isPreview: boolean) => void;
}

export default function PreviewButton({ onPreviewChange }: PreviewButtonProps) {
  const [isPreview, setIsPreview] = useState(false);
  const { settings } = useUISettings();

  const togglePreview = () => {
    const newPreviewState = !isPreview;
    setIsPreview(newPreviewState);
    onPreviewChange?.(newPreviewState);
  };

  return (
    <Button 
      variant={isPreview ? "default" : "outline"} 
      onClick={togglePreview}
      className="flex items-center gap-2"
      style={isPreview ? {
        backgroundColor: settings.primaryColor,
        borderColor: settings.primaryColor,
        color: 'white'
      } : {}}
    >
      {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {isPreview ? 'Вийти з Preview' : 'Preview режим'}
    </Button>
  );
}