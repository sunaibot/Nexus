declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void
    exec(sql: string, params?: any[]): { columns: string[]; values: any[][] }[]
    prepare(sql: string): Statement
    export(): Uint8Array
  }

  export interface Statement {
    bind(params?: any[]): void
    step(): boolean
    getAsObject(): any
    get(params?: any[]): any[]
    free(): void
  }

  export default function initSqlJs(): Promise<{
    Database: new (buffer?: Uint8Array) => Database
  }>
}
