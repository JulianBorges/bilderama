export interface Snippet {
  name: string;
  description: string;
  category: 'layout' | 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'gallery';
  code: string;
}

export const snippets: Snippet[] = [
  // --- LAYOUT ---
  {
    name: "Navbar",
    description: "Barra de navegação responsiva com logo e links.",
    category: 'layout',
    code: `
<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
  <nav class="container mx-auto flex items-center justify-between p-4">
    <a href="#" class="text-2xl font-bold text-gray-900 dark:text-white">{{logoText}}</a>
    <ul class="hidden gap-6 md:flex">
      {{#each links}}
      <li><a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">{{this}}</a></li>
      {{/each}}
    </ul>
    <button class="hidden rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 md:block">{{ctaText}}</button>
    <button class="p-2 md:hidden">
      <svg class="h-6 w-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
    </button>
  </nav>
</header>`
  },
  {
    name: "Footer",
    description: "Rodapé completo com links, social media e texto de copyright.",
    category: 'layout',
    code: `
<footer class="bg-gray-100 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8">
    <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{companyName}}</h3>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{companyDescription}}</p>
      </div>
      {{#each linkSections}}
      <div>
        <h4 class="font-semibold text-gray-800 dark:text-gray-200">{{this.title}}</h4>
        <ul class="mt-4 space-y-2">
          {{#each this.links}}
          <li><a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{{this}}</a></li>
          {{/each}}
        </ul>
      </div>
      {{/each}}
    </div>
    <div class="mt-8 flex flex-col items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row">
      <p class="text-sm text-gray-600 dark:text-gray-400">{{copyrightText}}</p>
      <div class="mt-4 flex gap-4 sm:mt-0">
        {{#each socialLinks}}
        <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="{{this.svgPath}}" clip-rule="evenodd" /></svg>
        </a>
        {{/each}}
      </div>
    </div>
  </div>
</footer>`
  },
  // --- HERO ---
  {
    name: "Hero Moderno",
    description: "Seção hero moderna com gradiente, texto centralizado e CTA",
    category: 'hero',
    code: `
<section class="relative h-[90vh] w-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
  <div class="container mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
    <h1 class="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
      {{title}}
    </h1>
    <p class="mb-8 max-w-2xl text-lg text-white/90">
      {{subtitle}}
    </p>
    <div class="flex gap-4">
      <button class="rounded-full bg-white px-8 py-3 font-semibold text-indigo-600 transition hover:bg-white/90">
        {{ctaPrimary}}
      </button>
      <button class="rounded-full border border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10">
        {{ctaSecondary}}
      </button>
    </div>
  </div>
</section>`
  },
  // --- FEATURES ---
  {
    name: "Card Feature",
    description: "Card moderno para destacar features com ícone e gradiente sutil",
    category: 'features',
    code: `
<div class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
  <div class="mb-4 inline-flex rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{iconSvgPath}}" />
    </svg>
  </div>
  <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
    {{title}}
  </h3>
  <p class="text-gray-600 dark:text-gray-400">
    {{description}}
  </p>
</div>`
  },
  {
    name: "Grid Features",
    description: "Grid responsivo para exibir múltiplas features. Usa 'Card Feature' internamente.",
    category: 'features',
    code: `
<section class="bg-white py-16 dark:bg-gray-950">
  <div class="container mx-auto px-4">
    <div class="text-center">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{{title}}</h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">{{subtitle}}</p>
    </div>
    <div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {{#each featureCards}}
        {{> Card Feature}}
      {{/each}}
    </div>
  </div>
</section>`
  },
  // --- TESTIMONIALS ---
  {
    name: "Testimonial Card",
    description: "Card para depoimentos com avatar e citação",
    category: 'testimonials',
    code: `
<div class="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800/50">
  <blockquote class="text-lg text-gray-700 dark:text-gray-300">
    "{{quote}}"
  </blockquote>
  <div class="mt-4 flex items-center gap-4">
    <div class="h-12 w-12 overflow-hidden rounded-full">
      <img
        src="{{avatarUrl}}"
        alt="Avatar de {{authorName}}"
        class="h-full w-full object-cover"
      />
    </div>
    <div>
      <h4 class="font-semibold text-gray-900 dark:text-white">{{authorName}}</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{authorRole}}</p>
    </div>
  </div>
</div>`
  },
  // --- PRICING ---
  {
    name: "Pricing Card",
    description: "Card para planos de preço com lista de features",
    category: 'pricing',
    code: `
<div class="rounded-2xl border {{#if featured}}border-indigo-500{{else}}border-gray-200{{/if}} bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
  {{#if featured}}
  <p class="absolute top-0 -translate-y-1/2 rounded-full bg-indigo-500 px-3 py-1 text-sm font-semibold text-white">Mais Popular</p>
  {{/if}}
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{planName}}</h3>
  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{planDescription}}</p>
  <div class="mt-4 flex items-baseline">
    <span class="text-4xl font-bold text-gray-900 dark:text-white">{{price}}</span>
    <span class="ml-1 text-gray-600 dark:text-gray-400">/{{billingCycle}}</span>
  </div>
  <ul class="mt-6 space-y-4">
    {{#each features}}
      <li class="flex items-center">
        <svg class="h-5 w-5 {{#if this.included}}text-green-500{{else}}text-gray-400{{/if}}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{#if this.included}}M5 13l4 4L19 7{{else}}M6 18L18 6M6 6l12 12{{/if}}" />
        </svg>
        <span class="ml-3 text-gray-600 dark:text-gray-400">{{this.name}}</span>
      </li>
    {{/each}}
  </ul>
  <button class="mt-8 w-full rounded-lg {{#if featured}}bg-indigo-600 text-white hover:bg-indigo-700{{else}}bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600{{/if}} px-4 py-2 font-semibold">
    {{ctaText}}
  </button>
</div>`
  },
  // --- CTA ---
  {
    name: "Call to Action",
    description: "Seção de CTA para incentivar uma ação do usuário.",
    category: 'cta',
    code: `
<section class="bg-indigo-600 dark:bg-indigo-800">
  <div class="container mx-auto max-w-4xl px-4 py-16 text-center lg:py-24">
    <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
      {{title}}
    </h2>
    <p class="mt-4 text-lg text-indigo-200">
      {{subtitle}}
    </p>
    <div class="mt-8">
      <a href="#" class="inline-block rounded-full bg-white px-8 py-3 font-semibold text-indigo-600 shadow-lg transition hover:bg-gray-100 hover:scale-105">
        {{buttonText}}
      </a>
    </div>
  </div>
</section>`
  },
  // --- GALLERY ---
  {
    name: "Logo Cloud",
    description: "Seção para exibir logotipos de clientes ou parceiros.",
    category: 'gallery',
    code: `
<section class="bg-white py-16 dark:bg-gray-950">
  <div class="container mx-auto px-4">
    <h2 class="text-center text-lg font-semibold text-gray-600 dark:text-gray-400">
      {{title}}
    </h2>
    <div class="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
      {{#each logos}}
      <div class="col-span-1 flex justify-center">
        <img
          class="h-12 w-auto object-contain"
          src="{{this.src}}"
          alt="{{this.alt}}"
        />
      </div>
      {{/each}}
    </div>
  </div>
</section>`
  }
]; 