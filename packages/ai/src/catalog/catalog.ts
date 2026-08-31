import type { Catalog, Model, Provider } from './types'

export function modelRef(model: Pick<Model, 'provider' | 'id'>): string {
  return `${model.provider}/${model.id}`
}

/** 只切第一个斜杠：OpenRouter / Vercel Gateway 的模型 id 自带 `vendor/model`。 */
export function parseModelRef(ref: string): { provider: string, id: string } {
  const slash = ref.indexOf('/')
  if (slash === -1)
    return { provider: ref, id: '' }
  return { provider: ref.slice(0, slash), id: ref.slice(slash + 1) }
}

export function createCatalog(providers: readonly Provider[]): Catalog {
  const byId = new Map(providers.map(p => [p.id, p]))
  return {
    providers,
    models: providers.flatMap(p => p.models),
    getProvider: id => byId.get(id),
    getModel: (ref) => {
      const { provider, id } = parseModelRef(ref)
      return byId.get(provider)?.models.find(m => m.id === id)
    },
    withProvider: p => createCatalog([...providers.filter(x => x.id !== p.id), p]),
    withoutProvider: id => createCatalog(providers.filter(x => x.id !== id)),
  }
}
