import React from 'react';
import { renderToString } from 'react-dom/server';
import { VisualCard } from './src/components/VisualCard';

const html = renderToString(
  <VisualCard 
    title="Meu Título" 
    quote="Minha Frase de Destaque" 
  />
);

console.log(html);
