import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface ExportMenuProps {
    onExportPDF: () => void;
    disabled?: boolean;
}

export function ExportMenu({ onExportPDF, disabled = false }: ExportMenuProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/50 hover:text-foreground transition-transform hover:scale-105"
                    disabled={disabled}
                >
                    <Download size={18} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        className="justify-start gap-2 text-sm font-normal hover:bg-secondary"
                        onClick={onExportPDF}
                    >
                        <FileText size={16} className="text-destructive" />
                        Экспорт PDF
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
