import { Spinner } from "@/components/ui/spinner";

const LoadingComponent = () => {
  return (
    <div className="flex items-center justify-center h-full overflow-hidden">
      <Spinner />
    </div>
  );
};

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center h-dvh overflow-hidden">
      <Spinner />
    </div>
  );
};

export { LoadingComponent, LoadingPage };
