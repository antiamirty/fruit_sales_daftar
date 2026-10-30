import React from 'react';
import { KhaznaWindow } from './KhaznaWindow';

interface TakfeelWindowProps {
  onClose?: () => void;
}

export const TakfeelWindow: React.FC<TakfeelWindowProps> = ({ onClose }) => {
  return <KhaznaWindow mode="w_takfeel" onClose={onClose} />;
};
