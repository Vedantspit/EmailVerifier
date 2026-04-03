/**
 * Protected route component for authentication-required pages
 * Redirects unauthenticated users to login page
 * Uses session-based authentication with backend validation
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi } from '../lib/api';


interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}


/**
 * Protected route wrapper component
 * Validates authentication with backend session
 * @param children - Components to render if authenticated
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Where to redirect if not authenticated (default: /login)
 * @returns ProtectedRoute JSX element or redirect
 */
export function ProtectedRoute({
    children,
    requireAuth = true,
    redirectTo = '/login',
}: ProtectedRouteProps) {
    try {
        const location = useLocation();
        const [isChecking, setIsChecking] = useState(true);
        const [authenticated, setAuthenticated] = useState(false);


        // Check authentication status with backend
        useEffect(() => {
            const checkAuth = async () => {
                try {
                    await authApi.getCurrentUser();
                    setAuthenticated(true);
                } catch (error) {
                    setAuthenticated(false);
                } finally {
                    setIsChecking(false);
                }
            };

            checkAuth();
        }, []);


        // Show loading while checking authentication
        if (isChecking) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-sm text-gray-600">Loading...</p>
                    </div>
                </div>
            );
        }


        // If auth is required and user is not authenticated, redirect to login
        if (requireAuth && !authenticated) {
            return (
                <Navigate
                    to={redirectTo}
                    state={{ from: location.pathname }}
                    replace
                />
            );
        }


        // If auth is not required and user is authenticated, redirect to dashboard
        if (!requireAuth && authenticated) {
            const from = (location.state as Record<string, string>)?.from || '/dashboard';
            return (
                <Navigate
                    to={from}
                    replace
                />
            );
        }


        // Render children if conditions are met
        return <>{children}</>;
    } catch (error) {
        console.error('ProtectedRoute error:', error);

        // Fallback to login redirect on error
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    } finally {
        // Debug logging omitted for production
    }
}


/**
 * Public route wrapper - redirects authenticated users to dashboard
 * @param children - Components to render if not authenticated
 * @returns PublicRoute JSX element or redirect
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
    try {
        return (
            <ProtectedRoute requireAuth={false}>
                {children}
            </ProtectedRoute>
        );
    } catch (error) {
        console.error('PublicRoute error:', error);
        return <>{children}</>;
    } finally {
        // Debug logging omitted for production
    }
}