import axios from 'axios';

const trimTrailingSlash = (url) => url?.replace(/\/+$/, '');

const resolveBaseURL = () => {
  const envUrl = trimTrailingSlash(process.env.REACT_APP_API_URL);
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${trimTrailingSlash(window.location.origin)}/api`;
  }

  return '/api';
};

const apiClient = axios.create({
  baseURL: resolveBaseURL(),
});

const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('accessToken');
};

const getRefreshToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('refreshToken');
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const refreshToken = getRefreshToken();

    if (response?.status === 401 && refreshToken && !config._retry) {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          .then((refreshResponse) => {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
              refreshResponse.data?.data || {};

            if (typeof window !== 'undefined') {
              if (newAccessToken) {
                window.localStorage.setItem('accessToken', newAccessToken);
              }
              if (newRefreshToken) {
                window.localStorage.setItem('refreshToken', newRefreshToken);
              }
            }

            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        config._retry = true;
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
    }

    if (response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('currentUser');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
