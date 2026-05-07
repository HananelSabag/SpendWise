export default {
  title: "Shopping List",
  manageList: "Manage your shared lists",
  loading: "Loading shopping list...",
  itemsCount: "{{count}} items",
  addItemAria: "Add item",
  allCategories: "All",

  error: {
    title: "Error loading list",
  },

  empty: {
    title: "List is Empty",
    description: "Add items you want to buy, with price and link — all in one place",
    addFirst: "Add First Item",
    filteredTitle: "No items in this category",
    filteredDescription: "Try selecting a different category or remove the filter",
  },

  sheet: {
    addTitle: "Add Item to List",
    editTitle: "Edit Item",
    saveChanges: "Save Changes",
    addToList: "Add to List",
  },

  fields: {
    name: {
      label: "Product Name",
      placeholder: "E.g.: Gaming chair, Blender...",
    },
    category: {
      label: "Category",
    },
    price: {
      label: "Estimated Price ₪",
    },
    url: {
      label: "Purchase Link (optional)",
    },
    notes: {
      label: "Notes (optional)",
      placeholder: "Color, size, specs...",
    },
  },

  validation: {
    nameRequired: "Product name is required",
    urlInvalid: "Link must start with https://",
  },

  categories: {
    furniture: "Furniture",
    kitchen: "Kitchen",
    bedroom: "Bedroom",
    electronics: "Electronics",
    clothing: "Clothing",
    other: "Other",
  },

  card: {
    markAsBought: "Mark as purchased",
    markAsNotBought: "Mark as not purchased",
    editAria: "Edit item",
    deleteAria: "Delete item",
    confirmDelete: "Delete?",
    buyNow: "Buy Now",
  },

  boughtSection: "Purchased ({{count}})",
  totalPending: "Total to Buy",
  pendingItems: "{{count}} items pending",
  boughtItems: "{{count}} purchased",

  toasts: {
    fetchError: "Failed to load shopping list",
    createSuccess: "Item added to list",
    createError: "Failed to add item",
    updateSuccess: "Item updated",
    updateError: "Failed to update item",
    deleteSuccess: "Item deleted",
    deleteError: "Failed to delete item",
  },

  sharingBanner: {
    youLead: "You manage",
    managedBy: "Managed by {{name}}",
    andMore: "+{{count}} more",
    tapToManage: "Tap to manage",
  },

  inviteBanner: {
    invited: "{{name}} invited you to a shared list",
    moreInvitations: "+{{count}} more invitations",
    tapToView: "Tap to view",
  },

  share: {
    button: "Share List",
    title: "Share Shopping List",
    description: "Enter the email of the person you'd like to share with",
    emailLabel: "Email Address",
    emailPlaceholder: "friend@example.com",
    emailRequired: "Email required",
    emailInvalid: "Invalid email",
    send: "Send Invitation",
    sending: "Sending...",
    successMessage: "If this email is registered, an invitation has been sent",
    pendingLabel: "Pending Invitations",
    receivedLabel: "Invitations Received",
    invitedYou: "Invited you to a shopping list",
    accept: "Accept",
    decline: "Decline",
    membersLabel: "Shared With",
    memberBadge: "Member",
    sharedWithMeLabel: "Shared With Me",
    remove: "Remove",
    leave: "Leave Shared List",
    ownerBadge: "Owner",
    sharedBadge: "Shared",
    awaitingResponse: "Awaiting response",
    emptyTitle: "You haven't shared the list yet",
    emptyDescription: "Invite friends to join and share your list",
    leaderBadge: "Leader",
    disbandTitle: "Disband Sharing",
    disbandConfirm: "This will remove all members. They will lose access to your shared items.",
    disbandButton: "Yes, disband",
    leaveConfirm: "Are you sure you want to leave this shared list?",
    leaveButton: "Yes, leave",
    cancel: "Cancel",
  },
};
