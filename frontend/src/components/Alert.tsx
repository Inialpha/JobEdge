//import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { useState, useEffect } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

type Variant = 'success' | 'error' | 'warning';

export type FeedbackState = {
  message: string;
  variant?: Variant;
};

export default function Feedback({variant = 'success', title, message}: {variant?: Variant, title?: string, message: string}) {
  const classes = {
    success: "w-full text-center bg-green-200",
    error: "w-full text-center bg-red-200",
    warning: "w-full text-center bg-yellow-200",
  }
  const className = classes[variant]
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) return null;

  return (
    <Alert className={className}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  )
}

