import React from 'react';

type CardVariant = 'default' | 'glass';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-white
    shadow-soft hover:shadow-soft-lg
    border border-slate-100
  `,
  glass: `
    bg-white/80 backdrop-blur-md
    border border-white/20
    shadow-xl
  `,
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      className={`
        rounded-2xl p-6
        transition-shadow duration-300
        ${variantStyles[variant]}
        ${hoverable ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-slate-100 rounded-lg">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
};
