import { auth } from './auth';
import { home } from './home';
import { lists } from './lists';
import { product } from './product';
import { profile } from './profile';
import { providers } from './providers';
import { search } from './search';
import { shared } from './shared';

export const es = {
  auth,
  home,
  lists,
  product,
  profile,
  providers,
  search,
  shared,
} as const;
