import { redirect } from "next/navigation";

// A tela de Login é a primeira tela da aplicação.
export default function Home() {
  redirect("/login");
}
