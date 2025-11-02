import { SupportedLanguage } from "@repo/shared/types"

interface LanguageConfig {
  id: string,
  label: SupportedLanguage,
  logoPath: string
}

export const languageConfig:LanguageConfig[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    logoPath: '/javascript.png',
  },
  {
    id: 'python',
    label: 'Python',
    logoPath: '/python.png',
  },
  {
    id: 'java',
    label: 'Java',
    logoPath: '/java.png',
  },
  {
    id: 'cpp',
    label: 'C++',
    logoPath: '/cpp.png',
  },
  {
    id: 'c',
    label: 'C',
    logoPath: '/c.png',
  }
]


export const monacoLanguage = {
  'JavaScript': 'javascript',
  'Java': 'java',
  'C': 'c',
  'C++': 'cpp',
  'Python': 'python'
}

export const workerLanguage = {
  'JavaScript': 'js',
  'Java': 'java',
  'C': 'c',
  'C++': 'cpp',
  'Python': 'py'
}