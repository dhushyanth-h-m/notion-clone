"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface) => {
        // This migration is now a no-op since we're using UUID for the user IDs from the start
        console.log('Migration 08 is now a no-op since we are using UUID consistently');
    },
    down: async (queryInterface) => {
        // Nothing to revert
    }
};
