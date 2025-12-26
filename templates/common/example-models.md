# Example Models

This file contains reference schemas you can use.

## User Model

- id: unique identifier
- email: unique, required
- name: optional
- createdAt: auto-generated
- updatedAt: auto-updated

## Post Model

- id: unique identifier
- title: required
- content: optional text
- published: boolean, default false
- authorId: foreign key to User
- createdAt: auto-generated
- updatedAt: auto-updated

## Comment Model

- id: unique identifier
- content: required text
- postId: foreign key to Post
- authorId: foreign key to User
- createdAt: auto-generated
- updatedAt: auto-updated
