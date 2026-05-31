export const THEME = {
  colors: {
    primary: '#1a365d', // Navy Blue
    secondary: '#ff7a00', // Orange
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
  }
};

export const CATEGORIES = {
  products: ['Tecnologia', 'Moda', 'Saúde', 'Construção', 'Casa', 'Agricultura'],
  services: ['Reparações', 'Limpeza', 'Transporte', 'Serviços Digitais', 'Educação', 'Saúde e Bem-estar'],
  ifood: ['Restaurantes', 'Fast Food', 'Bebidas', 'Padarias', 'Supermercados', 'Comida Tradicional'],
  infoproducts: ['Cursos', 'E-books', 'Templates', 'Mentorias', 'Softwares', 'Conteúdos Exclusivos', 'Ferramentas Digitais'],
};

export const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Smart TV 4K 55"',
    description: 'Ultra HD com HDR e Smart Hub.',
    price: 45000,
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=400',
    sellerId: 's1',
    rating: 4.8,
    reviewsCount: 124,
  },
  {
    id: 'p2',
    name: 'Mochila Tech',
    description: 'Resistente à água com porta USB.',
    price: 3200,
    category: 'Moda',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    sellerId: 's2',
    rating: 4.5,
    reviewsCount: 89,
  }
];

export const MOCK_SERVICES = [
  {
    id: 's1',
    name: 'Limpeza Doméstica',
    description: 'Serviço profissional de limpeza profunda.',
    pricePerHour: 500,
    category: 'Limpeza',
    imageUrl: 'https://images.unsplash.com/photo-1581571253579-25bb090ca095?auto=format&fit=crop&q=80&w=400',
    providerId: 'p1',
    rating: 4.9,
    reviewsCount: 56,
  }
];
