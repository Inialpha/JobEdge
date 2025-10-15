//import React from 'react'

interface SlideProps {
  title: string;
  content: string;
  imageUrl: string;
}

export default function Slide({ title, content, imageUrl }: SlideProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h4 className="text-lg font-semibold">{title}</h4>
      <p>{content}</p>
      {imageUrl && (
        <div className="relative h-40 w-full">
          <img
            src={imageUrl}
            alt={title}
            className="rounded-md w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}
