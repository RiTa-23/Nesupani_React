import React from 'react';
import { Train } from 'lucide-react';

interface TrainIconProps {
  size?: number;
  className?: string;
}

const TrainIcon: React.FC<TrainIconProps> = ({ size = 64, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute animate-pulse">
        <Train size={size} className="text-blue-500" />
      </div>
      <Train size={size} className="text-blue-600" />
    </div>
  );
};

export default TrainIcon;