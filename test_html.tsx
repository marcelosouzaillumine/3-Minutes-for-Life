import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisualCard } from './src/components/VisualCard';

const html = renderToStaticMarkup(<VisualCard title="Test Title" quote="Test Quote" />);
console.log(html);
