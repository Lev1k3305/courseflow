export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h2 className="text-2xl font-bold">Страница не найдена</h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Извините, запрашиваемая страница не существует.
      </p>
      <a href="/" className="mt-6 text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
        Вернуться на главную
      </a>
    </div>
  );
}
