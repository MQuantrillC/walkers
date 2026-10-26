import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { SITE } from "@/lib/site";
import styles from "./privacy.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "es" ? "Privacidad · WALKERS" : "Privacy · WALKERS" };
}

function updated(lang: Locale) {
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${SITE.privacyUpdated}T12:00:00Z`),
  );
}

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const CONTENT: Record<Locale, { title: string; updated: string; sections: [string, ReactNode][] }> = {
  en: {
    title: "Privacy",
    updated: "Last updated",
    sections: [
      [
        "In short",
        <p key="p">
          WALKERS lets you create a walking character and, if you choose, publish it to a public gallery. We collect as
          little as we need to do that. No ads, no tracking, and we never sell data.
        </p>,
      ],
      [
        "When you sign in with Google",
        <p key="p">
          Google shares your name, email address and profile picture with Supabase, the service that runs our accounts
          and database. We use them only to recognise your account. Your email and Google details are never shown
          publicly.
        </p>,
      ],
      [
        "Your walker",
        <p key="p">
          We store your walker&apos;s display name, how it looks (including anything you paint on it), whether it is
          published, and when it was saved and published. A published walker, with its display name and publication
          date, is visible to anyone in the gallery and on its own page. Drafts are private.
        </p>,
      ],
      [
        "Reports",
        <p key="p">
          If you report a walker, we store which walker, the reason, any text you add and, if you were signed in, your
          account ID, so moderators can review it.
        </p>,
      ],
      [
        "On your device",
        <p key="p">
          Your in-progress walker is saved in your browser so you don&apos;t lose it. We also use a cookie to keep you
          signed in, a cookie to remember your language, and a short list of walkers you have reported. Your country,
          as estimated by our host from your IP address, is used only to pick a language and is not stored.
        </p>,
      ],
      [
        "Who processes your data",
        <p key="p">
          Supabase (accounts and database), Vercel (hosting) and Google (sign-in). Their servers may be outside your
          country.
        </p>,
      ],
      [
        "Your choices",
        <p key="p">
          You can edit, unpublish or delete your walker at any time from My Walker. You can also delete your account
          there, which removes your account, profile and walker. Reports you filed are kept without your account ID.
        </p>,
      ],
      ["Children", <p key="p">WALKERS is not intended for children under 13.</p>],
      ["Contact", <p key="p">Questions or requests: {mail}.</p>],
    ],
  },
  es: {
    title: "Privacidad",
    updated: "Última actualización",
    sections: [
      [
        "En resumen",
        <p key="p">
          WALKERS te permite crear un personaje que camina y, si quieres, publicarlo en una galería pública. Recogemos
          solo lo necesario para eso. Sin anuncios, sin rastreo, y nunca vendemos datos.
        </p>,
      ],
      [
        "Cuando inicias sesión con Google",
        <p key="p">
          Google comparte tu nombre, tu correo y tu foto de perfil con Supabase, el servicio que gestiona nuestras
          cuentas y base de datos. Los usamos solo para reconocer tu cuenta. Tu correo y tus datos de Google nunca se
          muestran públicamente.
        </p>,
      ],
      [
        "Tu caminante",
        <p key="p">
          Guardamos el nombre público de tu caminante, cómo se ve (incluido lo que pintes), si está publicado y cuándo se
          guardó y publicó. Un caminante publicado, con su nombre y fecha de publicación, es visible para cualquiera en
          la galería y en su propia página. Los borradores son privados.
        </p>,
      ],
      [
        "Reportes",
        <p key="p">
          Si reportas un caminante, guardamos cuál, el motivo, el texto que añadas y, si habías iniciado sesión, el ID
          de tu cuenta, para que la moderación pueda revisarlo.
        </p>,
      ],
      [
        "En tu dispositivo",
        <p key="p">
          Tu caminante en progreso se guarda en tu navegador para que no lo pierdas. También usamos una cookie para
          mantener tu sesión, otra para recordar tu idioma, y una pequeña lista de caminantes que has reportado. Tu
          país, estimado por nuestro proveedor a partir de tu IP, solo se usa para elegir el idioma y no se guarda.
        </p>,
      ],
      [
        "Quién trata tus datos",
        <p key="p">
          Supabase (cuentas y base de datos), Vercel (alojamiento) y Google (inicio de sesión). Sus servidores pueden
          estar fuera de tu país.
        </p>,
      ],
      [
        "Tus opciones",
        <p key="p">
          Puedes editar, despublicar o eliminar tu caminante en cualquier momento desde Mi caminante. Ahí también puedes
          eliminar tu cuenta, lo que borra tu cuenta, tu perfil y tu caminante. Los reportes que hayas enviado se
          conservan sin el ID de tu cuenta.
        </p>,
      ],
      ["Menores", <p key="p">WALKERS no está dirigido a menores de 13 años.</p>],
      ["Contacto", <p key="p">Preguntas o solicitudes: {mail}.</p>],
    ],
  },
};

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = CONTENT[lang];
  return (
    <article className={styles.page}>
      <h1>{c.title}</h1>
      <p className={styles.updated}>
        {c.updated}: {updated(lang)}
      </p>
      {c.sections.map(([heading, body]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          {body}
        </section>
      ))}
    </article>
  );
}
