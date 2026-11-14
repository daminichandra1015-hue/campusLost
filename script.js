
// CampusFind - Lost & Found Portal

const itemForm = document.getElementById("itemForm");
const itemsContainer = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const emptyMessage = document.getElementById("emptyMessage");

const itemImageInput = document.getElementById("itemImage");
const submitBtn = document.getElementById("submitBtn");

const itemModal = document.getElementById("itemModal");
const closeModal = document.getElementById("closeModal");
const modalDetails = document.getElementById("modalDetails");

const itemTypeInput = document.getElementById("itemType");
const itemDateInput = document.getElementById("itemDate");
const itemDateLabel = document.getElementById("itemDateLabel");

let campusItems = [];
let editingItemId = null;

// Load saved items
try {
    campusItems = JSON.parse(localStorage.getItem("campusItems")) || [];

    if (!Array.isArray(campusItems)) {
        campusItems = [];
    }
} catch (error) {
    campusItems = [];
}

// Save items
function saveItems() {
    try {
        localStorage.setItem("campusItems", JSON.stringify(campusItems));
        return true;
    } catch (error) {
        alert("Storage is full. Please use a smaller image or remove some old reports.");
        return false;
    }
}

// Generate unique report ID
function generateReportCode() {
    const year = new Date().getFullYear();

    const pattern = new RegExp("^CF-" + year + "-(\\d+)$");

    const highestNumber = campusItems.reduce((max, item) => {
        const match = (item.reportCode || "").match(pattern);

        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return `CF-${year}-${String(highestNumber + 1).padStart(3, "0")}`;
}

// Give IDs to older reports that don't have one
let reportsUpdated = false;

campusItems.forEach(item => {
    if (!item.reportCode) {
        item.reportCode = generateReportCode();
        reportsUpdated = true;
    }
});

if (reportsUpdated) {
    saveItems();
}

// Prevent HTML injection
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

// Format date and time selected by user
function formatItemDate(value) {
    if (!value) return "Not recorded";

    const parts = value.split("T");
    const dateParts = parts[0].split("-");

    if (dateParts.length !== 3) return escapeHTML(value);

    const date = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2])
    );

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    if (!parts[1]) {
        return formattedDate;
    }

    const timeParts = parts[1].split(":");

    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);

    const time = new Date();
    time.setHours(hours, minutes, 0, 0);

    return formattedDate + " · " + time.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

// Format automatically saved timestamps
function formatUpdatedDate(value) {
    if (!value) return "Not updated";

    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
// Format report date and time
function formatTimestamp(value) {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "Not recorded";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

// Change date label according to report type
function updateDateLabel() {
    if (itemTypeInput.value === "Lost") {
        itemDateLabel.textContent = "Item Lost On *";
    } else if (itemTypeInput.value === "Found") {
        itemDateLabel.textContent = "Item Found On *";
    } else {
        itemDateLabel.textContent = "Lost / Found Date & Time *";
    }
}

itemTypeInput.addEventListener("change", updateDateLabel);

// Statistics
function updateStats() {
    const lostCount = campusItems.filter(
        item => item.type === "Lost" && item.status !== "Returned"
    ).length;

    const foundCount = campusItems.filter(
        item => item.type === "Found" && item.status !== "Returned"
    ).length;

    const returnedCount = campusItems.filter(
        item => item.status === "Returned"
    ).length;

    document.getElementById("lostCount").textContent = lostCount;
    document.getElementById("foundCount").textContent = foundCount;
    document.getElementById("returnedCount").textContent = returnedCount;
}

// Automatic category-wise default images
function getDefaultImage(category) {
    const defaultImages = {
        "Electronics": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        "Books & Notes": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
        "Accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        "ID Cards": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        "Bags": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        "Clothing": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
        "Other": "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600"
    };

    return defaultImages[category] || defaultImages["Other"];
}


// Get status class
function getStatusClass(item) {
    if (item.status === "Returned") {
        return "status-returned";
    }

    return item.type === "Lost" ? "status-lost" : "status-found";
}

// Display items
function displayItems() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedFilter = filterType.value;

    const filteredItems = campusItems.filter(item => {
        const searchableText = [
            item.name,
            item.category,
            item.location,
            item.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        let matchesFilter = true;

        if (selectedFilter === "Returned") {
            matchesFilter = item.status === "Returned";
        } else if (selectedFilter === "Lost" || selectedFilter === "Found") {
            matchesFilter = item.type === selectedFilter;
        }

        return matchesSearch && matchesFilter;
    });

    itemsContainer.innerHTML = "";

    emptyMessage.style.display =
        filteredItems.length === 0 ? "block" : "none";

    filteredItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";


        const imageSource = item.image || getDefaultImage(item.category);

        const imageHTML = `
    <img
        src="${imageSource}"
        class="item-image"
        alt="${escapeHTML(item.name)}"
        onerror="this.onerror=null; this.outerHTML='<div class=&quot;item-image-placeholder&quot;>⌕</div>';"
    >
`;

        const statusText = item.status === "Returned"
            ? "Returned"
            : item.type;

        card.innerHTML = `
            ${imageHTML}

            <div class="item-card-content">

                <div class="item-card-top">
                    <span class="status ${getStatusClass(item)}">
                        ${statusText}
                    </span>

                    <span class="item-category">
                        ${escapeHTML(item.category)}
                    </span>
                </div>

              <h3>${escapeHTML(item.name)}</h3>

<p class="report-id">
    <strong>Report ID:</strong> ${escapeHTML(item.reportCode || "Pending")}
</p>

                <p>📍 ${escapeHTML(item.location)}</p>

                <p>📅 ${escapeHTML(item.type === "Lost" ? "Lost On" : "Found On")}:
                    ${formatItemDate(item.date)}
                </p>

                <p>🕒 Reported On: ${formatTimestamp(item.createdAt)}</p>

                ${item.status === "Returned" && item.returnedAt ? `
                    <p>✅ Returned On: ${formatTimestamp(item.returnedAt)}</p>
                ` : ""}

                <p class="item-description">
                    ${escapeHTML(item.description)}
                </p>

                <div class="card-actions">
                    <button class="card-btn primary-action"
                        data-action="details" data-id="${item.id}">
                        View Details
                    </button>

                    <button class="card-btn"
                        data-action="edit" data-id="${item.id}">
                        Edit
                    </button>

                    ${item.status !== "Returned" ? `
                        <button class="card-btn"
                            data-action="returned" data-id="${item.id}">
                            Mark Returned
                        </button>
                    ` : ""}

                    <button class="card-btn delete-action"
                        data-action="delete" data-id="${item.id}">
                        Delete
                    </button>
                </div>
            </div>
        `;

        itemsContainer.appendChild(card);
    });

    updateStats();
}

// Search and filter
searchInput.addEventListener("input", displayItems);
filterType.addEventListener("change", displayItems);

// Read uploaded image
function readImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {
            reject(new Error("Please upload a JPG, PNG, WEBP or GIF image."));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            reject(new Error("Image size must be less than 2 MB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read the image."));

        reader.readAsDataURL(file);
    });
}

// Submit or update report
itemForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const type = itemTypeInput.value;
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("category").value;
    const location = document.getElementById("location").value.trim();
    const date = itemDateInput.value;
    const description = document.getElementById("description").value.trim();
    const contact = document.getElementById("contact").value.trim();

    const selectedFile = itemImageInput.files[0];

    const existingItem = editingItemId !== null
        ? campusItems.find(item => String(item.id) === String(editingItemId))
        : null;

    if (!type || !name || !category || !location || !date || !description || !contact) {
        alert("Please fill in all required fields.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";

    try {
        const uploadedImage = await readImage(selectedFile);

        const itemData = {
            type,
            name,
            category,
            location,
            date,
            description,
            contact,
            image: uploadedImage || (existingItem ? existingItem.image : null),
            status: existingItem ? existingItem.status : type,
            updatedAt: new Date().toISOString()
        };

        if (existingItem) {
            Object.assign(existingItem, itemData);
        } else {
            campusItems.unshift({
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                reportCode: generateReportCode(),
                ...itemData,
                status: type,
                createdAt: new Date().toISOString()
            });
        }

        if (!saveItems()) {
            return;
        }

        resetItemForm();
        displayItems();

        alert(existingItem
            ? "Report updated successfully!"
            : "Your report has been submitted successfully!");

        document.getElementById("browse").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        alert(error.message || "Something went wrong. Please try again.");
    } finally {
        submitBtn.disabled = false;

        submitBtn.textContent = editingItemId !== null
            ? "Update Report"
            : "Submit Report";
    }
});

// Reset form
function resetItemForm() {
    itemForm.reset();
    editingItemId = null;
    submitBtn.textContent = "Submit Report";
    submitBtn.disabled = false;
    updateDateLabel();
}

// Edit report
function editItem(id) {
    const item = campusItems.find(
        item => String(item.id) === String(id)
    );

    if (!item) return;

    editingItemId = item.id;

    itemTypeInput.value = item.type;
    document.getElementById("itemName").value = item.name;
    document.getElementById("category").value = item.category;
    document.getElementById("location").value = item.location;

    // Older reports may only have a date, without a time.
    itemDateInput.value = item.date && !item.date.includes("T")
        ? item.date + "T00:00"
        : item.date || "";

    document.getElementById("description").value = item.description;
    document.getElementById("contact").value = item.contact;

    updateDateLabel();

    // File inputs cannot be prefilled by the browser.
    itemImageInput.value = "";

    submitBtn.textContent = "Update Report";

    document.getElementById("report").scrollIntoView({
        behavior: "smooth"
    });

    setTimeout(() => {
        document.getElementById("itemName").focus({
            preventScroll: true
        });
    }, 400);
}

// Mark item as returned
function markReturned(id) {
    const item = campusItems.find(
        item => String(item.id) === String(id)
    );

    if (!item) return;

    if (confirm("Mark this item as returned?")) {
        const previousStatus = item.status;
        const previousReturnedAt = item.returnedAt;

        item.status = "Returned";
        item.returnedAt = new Date().toISOString();

        if (!saveItems()) {
            item.status = previousStatus;
            item.returnedAt = previousReturnedAt;
            return;
        }

        displayItems();
    }
}

// Delete report
function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this report?")) {
        return;
    }

    const previousItems = [...campusItems];

    campusItems = campusItems.filter(
        item => String(item.id) !== String(id)
    );

    if (!saveItems()) {
        campusItems = previousItems;
        return;
    }

    displayItems();
}

// View details
function viewDetails(id) {
    const item = campusItems.find(
        item => String(item.id) === String(id)
    );

    if (!item) return;


    const imageSource = item.image || getDefaultImage(item.category);

    const imageHTML = `
    <img
        src="${imageSource}"
        alt="${escapeHTML(item.name)}"
        onerror="this.onerror=null; this.style.display='none';"
    >
`;

    modalDetails.innerHTML = `
        <span class="status ${getStatusClass(item)}">
            ${escapeHTML(item.status === "Returned" ? "Returned" : item.type)}
        </span>

        <h2>${escapeHTML(item.name)}</h2>
        <p><strong>Report ID:</strong>
    ${escapeHTML(item.reportCode || "Pending")}
</p>

        ${imageHTML}

        <p><strong>Category:</strong> ${escapeHTML(item.category)}</p>
        <p><strong>Location:</strong> ${escapeHTML(item.location)}</p>

        <p><strong>${item.type === "Lost" ? "Item Lost On" : "Item Found On"}:</strong>
            ${formatItemDate(item.date)}
        </p>

        <p><strong>Reported On:</strong>
            ${formatTimestamp(item.createdAt)}
        </p>

        ${item.status === "Returned" ? `
            <p><strong>Returned On:</strong>
                ${formatTimestamp(item.returnedAt)}
            </p>
        ` : ""}

        <p><strong>Description:</strong> ${escapeHTML(item.description)}</p>
        <p><strong>Contact:</strong> ${escapeHTML(item.contact)}</p>
    `;

    itemModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// Close details modal
function closeItemModal() {
    itemModal.classList.remove("active");
    document.body.style.overflow = "";
}

closeModal.addEventListener("click", closeItemModal);

itemModal.addEventListener("click", function (event) {
    if (event.target === itemModal) {
        closeItemModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeItemModal();
    }
});

// Handle card buttons
itemsContainer.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "details") {
        viewDetails(id);
    } else if (action === "edit") {
        editItem(id);
    } else if (action === "returned") {
        markReturned(id);
    } else if (action === "delete") {
        deleteItem(id);
    }
});

// Initial display
updateDateLabel();
displayItems();
