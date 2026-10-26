import { notFound } from "next/navigation";

// Any other address under a language: that language's "not found" page,
// inside the site's header and footer.
export default function Unknown() {
  notFound();
}
