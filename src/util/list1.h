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

static inline List1Node *list1_prev(List1Node *head, List1Node *node) {
  for (List1Node *walk = head, *prev = NULL; walk; walk = walk->next) {
    if (walk == node) {
      return prev;
    }
    prev = walk;
  }
  return NULL;
}

static inline List1Node *list1_prepend(List1Node **head, List1Node *node) {
  node->next = *head;
  *head = node;
  return node;
}

static inline List1Node *list1_append(List1Node **head, List1Node *node) {
  if (*head) {
    list1_last(*head)->next = node;
  } else {
    *head = node;
  }
  return node;
}

static inline int list1_index(List1Node *head, List1Node *node) {
  List1Node *walk = head;
  for (int i = 0; walk; ++i) {
    if (walk == node) {
      return i;
    }
    walk = walk->next;
  }
  return -1;
}

static inline List1Node *list1_insert(List1Node **head, int index, List1Node *node) {
  List1Node **next_ref = head;
  List1Node *walk = *head;
  for (int i = 0; walk && i < index; ++i) {
    next_ref = &walk->next;
    walk = walk->next;
  }
  node->next = *next_ref;
  *next_ref = node;
  return node;
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

static inline List1Node *list1_find_last(List1Node *node, List1FilterCallback callback, void *data) {
  List1Node *match = NULL;
  for (; node; node = node->next) {
    if (callback(node, data)) {
      match = node;
    }
  }
  return match;
}

static inline List1Node *list1_find(List1Node *node, List1FilterCallback callback, void *data) {
  return list1_find_prev(node, callback, data, NULL);
}

static inline List1Node *list1_remove_prev(List1Node **head, List1Node *node, List1Node *prev) {
  if (!node) { return NULL; }
  if (*head == node) {
    *head = node->next;
  }
  if (prev) {
    prev->next = node->next;
  }
  node->next = NULL;
  return node;
}

static inline List1Node *list1_remove(List1Node **head, List1Node *node) {
  return list1_remove_prev(head, node, list1_prev(*head, node));
}

static inline List1Node *list1_remove_one(List1Node **head, List1FilterCallback callback, void *data) {
  List1Node *prev = NULL;
  List1Node *node = list1_find_prev(*head, callback, data, &prev);
  return list1_remove_prev(head, node, prev);
}
