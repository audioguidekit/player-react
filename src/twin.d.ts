import 'twin.macro';
import { css as cssImport } from 'styled-components';
import styledImport from 'styled-components';

declare module 'twin.macro' {
  const css: typeof cssImport;
  const styled: typeof styledImport;
}

declare module 'react' {
  interface DOMAttributes<T> {
    tw?: string;
    css?: any;
  }
}
