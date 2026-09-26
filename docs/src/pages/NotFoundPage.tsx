import { FileQuestion } from "lucide-react";
import { Button } from "@/registry/bitop/ui/button/button";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { Link } from "../router";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<FileQuestion />}
      titleAs="h1"
      title="Page not found"
      description="That page doesn't exist. Try the component list or search with ⌘K."
      action={<Button render={<Link to="/components" />}>All components</Button>}
    />
  );
}
