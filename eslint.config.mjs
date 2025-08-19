import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';


const isDevelopment = process.env.NODE_ENV !== 'production';

export default tseslint.config(
    eslint.configs.recommended,
    isDevelopment ? tseslint.configs.recommended : tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            '@typescript-eslint/no-use-before-define': isDevelopment ? 'warn' : 'error',
            '@typescript-eslint/no-unused-vars': ['warn'],
            '@typescript-eslint/ban-ts-comment': ['off'],
            '@typescript-eslint/no-floating-promises': isDevelopment ? 'warn' : 'error',
            '@typescript-eslint/no-misused-promises': isDevelopment ? 'warn' : 'error',
            '@typescript-eslint/no-explicit-any': isDevelopment ? 'warn' : 'error',
            'prettier/prettier': 'warn',
        },
    },
);
