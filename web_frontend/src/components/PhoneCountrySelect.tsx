import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CountryOption } from "@/lib/countries";
import { CountryFlag } from "@/components/CountryFlag";
import { cn } from "@/lib/utils";

type Props = {
  options: CountryOption[];
  value: string;
  onValueChange: (code: string) => void;
  disabled?: boolean;
  triggerClassName?: string;
};

export function PhoneCountrySelect({ options, value, onValueChange, disabled, triggerClassName }: Props) {
  const selected = options.find((c) => c.code === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-[min(100%,11.5rem)] min-w-[8.5rem] data-[placeholder]:text-muted-foreground [&>svg]:shrink-0",
          triggerClassName,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {selected ? (
            <>
              <CountryFlag code={selected.code} />
              <span className="truncate tabular-nums">{selected.dialCode}</span>
            </>
          ) : (
            <span className="truncate text-muted-foreground">Country</span>
          )}
        </div>
        <span className="sr-only">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((country) => (
          <SelectItem
            key={country.code}
            value={country.code}
            textValue={`${country.name} ${country.dialCode}`}
          >
            <span className="flex w-full items-center gap-2">
              <CountryFlag code={country.code} />
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{country.dialCode}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
