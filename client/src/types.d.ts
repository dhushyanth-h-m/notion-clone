declare module 'axios' {
  export interface AxiosRequestConfig {
    baseURL?: string;
    headers?: any;
  }
  
  export interface AxiosInstance {
    create(config: any): AxiosInstance;
    interceptors: {
      request: {
        use(onFulfilled?: any, onRejected?: any): any;
      };
      response: {
        use(onFulfilled?: any, onRejected?: any): any;
      };
    };
    get(url: string, config?: any): Promise<any>;
    post(url: string, data?: any, config?: any): Promise<any>;
    put(url: string, data?: any, config?: any): Promise<any>;
    delete(url: string, config?: any): Promise<any>;
  }

  const axios: AxiosInstance;
  export default axios;
} 