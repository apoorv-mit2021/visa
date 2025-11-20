// src/services/authService.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: {
        email: string;
        roles: string[];
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    const {data} = await axios.post<LoginResponse>(`${API_BASE_URL}/admin/auth/login`, formData, {
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
    });
    return data;
};

export const getProfile = async (token: string) => {
    const {data} = await axios.get(`${API_BASE_URL}/admin/auth/me`, {
        headers: {Authorization: `Bearer ${token}`},
    });
    return data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};
