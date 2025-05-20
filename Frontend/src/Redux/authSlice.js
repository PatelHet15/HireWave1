import { createSlice } from "@reduxjs/toolkit";

// Helper function to compare users and prevent unnecessary updates
const areUsersEqual = (user1, user2) => {
    if (!user1 && !user2) return true;
    if (!user1 || !user2) return false;
    
    // Compare essential properties
    return user1.id === user2.id && 
        user1.email === user2.email &&
        user1.role === user2.role;
};

const authSlice = createSlice({
    name: "auth",
    initialState: {
        loading: false,
        user: null
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            // Create a completely new object to force React to recognize the change
            state.user = action.payload ? { ...action.payload } : null;
        },
        logoutUser: (state) => {
            state.user = null;
        }
    }
});

export const { setLoading, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
