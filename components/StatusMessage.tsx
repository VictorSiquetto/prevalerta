type StatusMessageProps = {
  isLoading: boolean;
  error: string | null;
};

export default function StatusMessage({ isLoading, error }: StatusMessageProps) {
  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Buscando condições meteorológicas...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  return null;
}
