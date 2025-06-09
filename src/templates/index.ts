// src/templates/index.ts

// Esta abordagem trata os templates como módulos, o que é mais amigável ao Webpack
// e evita a necessidade de acessar o sistema de arquivos em tempo de execução.

import Navbar from './Navbar.hbs';
import HeroModerno from './Hero Moderno.hbs';
import GridFeatures from './Grid Features.hbs';
import CardFeature from './Card Feature.hbs';
import Testimonials from './Testimonials.hbs';
import TestimonialCard from './Testimonial Card.hbs';
import PricingCard from './Pricing Card.hbs';
import CallToAction from './Call to Action.hbs';
import LogoCloud from './Logo Cloud.hbs';
import Footer from './Footer.hbs';
import Layout from './layout.hbs';

// Mapeia os nomes dos componentes para o conteúdo de seus templates
export const templates = {
  'Navbar': Navbar,
  'Hero Moderno': HeroModerno,
  'Grid Features': GridFeatures,
  'Card Feature': CardFeature,
  'Testimonials': Testimonials,
  'Testimonial Card': TestimonialCard,
  'Pricing Card': PricingCard,
  'Call to Action': CallToAction,
  'Logo Cloud': LogoCloud,
  'Footer': Footer,
  // O layout principal é tratado separadamente, mas o incluímos para consistência
  'Layout': Layout,
};

// Um tipo para garantir que estamos pedindo um template que existe
export type TemplateName = keyof typeof templates; 