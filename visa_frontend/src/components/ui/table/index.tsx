import React, {ReactNode, ThHTMLAttributes, TdHTMLAttributes} from "react";

// Props for Table
interface TableProps {
    children: ReactNode;
    className?: string;
}

export const Table: React.FC<TableProps> = ({children, className = ""}) => (
    <table className={`w-full table-auto ${className}`}>{children}</table>
);

// Props for TableHeader
interface TableHeaderProps {
    children: ReactNode;
    className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({children, className = ""}) => (
    <thead className={className}>{children}</thead>
);

// Props for TableBody
interface TableBodyProps {
    children: ReactNode;
    className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({children, className = ""}) => (
    <tbody className={className}>{children}</tbody>
);

// Props for TableRow
interface TableRowProps {
    children: ReactNode;
    className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({children, className = ""}) => (
    <tr className={className}>{children}</tr>
);

// TableCell props (including colSpan fix)
export interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
    isHeader?: boolean;
    className?: string;
    colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({isHeader, className = "", colSpan, ...rest}) => {
    if (isHeader) {
        const props = rest as ThHTMLAttributes<HTMLTableCellElement>;
        return <th className={`px-4 ${className}`} colSpan={colSpan} {...props} />;
    } else {
        const props = rest as TdHTMLAttributes<HTMLTableCellElement>;
        return <td className={`px-4 ${className}`} colSpan={colSpan} {...props} />;
    }
};
