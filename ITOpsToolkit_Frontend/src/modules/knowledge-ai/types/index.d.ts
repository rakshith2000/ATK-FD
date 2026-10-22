import type { mergedKnowledgeArticleResponseSchema } from '../schema/merged-knowledge-article-response.schema ';
import type { duplicateKBCatalogSchema, knowledgeArticleSchema } from '../schema/duplicate-kb-catalog.schema';

export type KnowledgeArticle = z.infer<typeof knowledgeArticleSchema>;

export interface DisplayValue {
    display_value: string;
    value: string;
}

export interface KnowledgeArticle_From_List_API {
    sys_id: DisplayValue;
    number: DisplayValue;
    short_description: DisplayValue;
    kb_knowledge_base: DisplayValue;
    sys_created_on: DisplayValue;
    author: DisplayValue;
    rating: DisplayValue;
    workflow_state: DisplayValue;
    text: DisplayValue;
    kb_category: DisplayValue;
    ai_score?: number;
}

export interface CategoryKBAnalytics {
    category: KBCategory;
    articlesCount: number;
    articles: KnowledgeArticle_From_List_API[];
    lowScoringArticlesCount: number;
    lowScoringArticles: KnowledgeArticle_From_List_API[];
}

export interface KBCatalogAnalytics {
    articlesCount: number;
    articles: KnowledgeArticle_From_List_API[];
    lowScoringArticlesCount: number;
    lowScoringArticles: KnowledgeArticle_From_List_API[];
    byCategory: CategoryKBAnalytics[];
}

export interface RecentKBArticle {
    number: string;
    short_description: string;
    kb_category: string;
}

// Duplicate KB
export type KBNumber = string;

export type KBCategory = string;

export type DuplicateKBCatalog = z.infer<typeof duplicateKBCatalogSchema>;

export type DuplicateKBCategoryMap = DuplicateKBCatalog[number];

export type DuplicateKBArticleMap = DuplicateKBCategoryMap[string][number];

export interface CategoryWiseDuplicateCatalog {
    category: KBCategory;
    articlesCount: number;
    duplicateArticlesCount: number;
    duplicateGroups: DuplicateGroup[];
}

export interface DuplicateGroup {
    groupIndex: number;
    articlesCount: number;
    category: string;
    knowledgeBase: string;
    articles: KnowledgeArticle[];
    kbNumbers: KBNumber[];
}

export interface DuplicateKBCatalogAnalytics {
    categoriesCount: number;
    articlesCount: number;
    duplicateGroupsCount: number;
    duplicateArticlesCount: number;
    byCategory: CategoryWiseDuplicateCatalog[];
}

export type MergedKnowledgeArticleResponse = z.infer<typeof mergedKnowledgeArticleResponseSchema>;
