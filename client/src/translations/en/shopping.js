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

  scrape: {
    fetching: "Fetching product info...",
    success: "Product info loaded",
    failed: "Couldn't load info — fill in manually",
    failedBlocked: "Site blocks auto-loading — fill in manually",
    failedTimeout: "Request timed out — fill in manually",
    failedNoData: "No product info found — fill in manually",
    imageFound: "Product image found",
  },

  tabs: {
    personal: "My List",
    shared: "Shared",
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
  spent: "spent",
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
    description: "Invite someone to your shopping list by email. They'll be able to add and manage items together with you.",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter email address...",
    emailRequired: "Please enter an email address",
    emailInvalid: "Please enter a valid email address",
    send: "Send Invitation",
    sending: "Sending...",
    successMessage: "Invitation sent!",
    pendingLabel: "Pending Invitations",
    receivedLabel: "Received Invitations",
    invitedYou: "Invited you to a shopping list",
    accept: "Accept",
    decline: "Decline",
    membersLabel: "My List Members",
    memberBadge: "Member",
    sharedWithMeLabel: "Shared With Me",
    remove: "Remove",
    leave: "Leave Shared List",
    ownerBadge: "Owner",
    sharedBadge: "Shared",
    awaitingResponse: "Awaiting response...",
    emptyTitle: "No shared lists yet",
    emptyDescription: "Invite someone to shop together!",
    leaderBadge: "Owner",
    disbandTitle: "Stop Sharing",
    disbandConfirm: "This will remove all members from your shared list and everyone will lose access. Are you sure?",
    disbandButton: "Disband",
    leaveConfirm: "You'll no longer have access to this shared list.",
    leaveButton: "Leave",
    cancel: "Cancel",
  },
};
