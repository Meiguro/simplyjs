#pragma once

#include <stdlib.h>
#include <stdbool.h>

typedef struct List1Node List1Node;

struct List1Node {
  List1Node *next;
};

typedef bool (*List1FilterCallback)(List1Node *node, void *data);

static inline size_t list1_size(List1Node *node) {
  size_t size = 0;
  for (; node; node = node->next) {
    size++;
  }
  return size;
}

static inline List1Node *list1_last(List1Node *node) {
  for (; node; node = node->next) {
    if (!node->next) {
      return node;
    }
  }
  return NULL;
}

static inline List1Node *list1_find_prev(List1Node *node,
    List1FilterCallback callback, void *data, List1Node **prev_out) {
  for (List1Node *prev = NULL; node; node = node->next) {
    if (callback(node, data)) {
      if (prev_out) {
        *prev_out = prev;
      }
      return node;
    }
    prev = node;
  }
  return NULL;
}

static inline List1Node *list1_find(List1Node *node, List1FilterCallback callback, void *data) {
  return list1_find_prev(node, callback, data, NULL);
}

static inline List1Node *list1_remove_one(List1Node **head, List1FilterCallback callback, void *data) {
  List1Node *prev = NULL;
  List1Node *node = *head;
  node = list1_find_prev(node, callback, data, &prev);
  if (node) {
    if (head && *head == node) {
      *head = node->next;
    }
    if (prev) {
      prev->next = node->next;
    }
  }
  return node;
}
