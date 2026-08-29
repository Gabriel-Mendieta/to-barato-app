import { api, endpoints } from '@/src/shared/api';
import type {
  CategoryDTO,
  ProductDTO,
  ProductPriceDTO,
  ProviderCatalogProductDTO,
  UnitDTO,
} from '@/src/shared/api/dto';

export type ProductEntityId = string | number;

export async function catalog(typeId?: ProductEntityId | null): Promise<ProductDTO[]> {
  const path = typeId == null ? endpoints.producto : endpoints.productoTipoProveedor(typeId);
  const { data } = await api.get<ProductDTO[]>(path);
  return data;
}

export async function catalogByType(typeId: ProductEntityId): Promise<ProductDTO[]> {
  return catalog(typeId);
}

export async function detail(productId: ProductEntityId): Promise<ProductDTO> {
  const { data } = await api.get<ProductDTO>(endpoints.productoById(productId));
  return data;
}

export async function prices(productId: ProductEntityId): Promise<ProductPriceDTO[]> {
  const { data } = await api.get<ProductPriceDTO[]>(endpoints.preciosProductos(productId));
  return data;
}

export async function byProvider(
  providerId: ProductEntityId,
): Promise<ProviderCatalogProductDTO[]> {
  const { data } = await api.get<ProviderCatalogProductDTO[]>(
    endpoints.preciosProductosProveedor(providerId),
  );
  return data;
}

export async function categories(): Promise<CategoryDTO[]> {
  const { data } = await api.get<CategoryDTO[]>(endpoints.categoria);
  return data;
}

export async function units(): Promise<UnitDTO[]> {
  const { data } = await api.get<UnitDTO[]>(endpoints.unidadmedida);
  return data;
}

export const productsApi = {
  catalog,
  catalogByType,
  detail,
  prices,
  byProvider,
  categories,
  units,
};
