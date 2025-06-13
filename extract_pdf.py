import PyPDF2

# Open the PDF file
pdf_file = open('FYP 2025.pdf', 'rb')
pdf_reader = PyPDF2.PdfReader(pdf_file)

# Get the number of pages
num_pages = len(pdf_reader.pages)
print(f"Total number of pages: {num_pages}")

# Extract text from each page and write to a text file
with open('pdf_content.txt', 'w', encoding='utf-8') as text_file:
    for page_num in range(num_pages):
        page = pdf_reader.pages[page_num]
        text = page.extract_text()
        text_file.write(f"\n--- Page {page_num + 1} ---\n\n")
        text_file.write(text)
        text_file.write("\n")

# Close the PDF file
pdf_file.close()

print("Text extraction complete. Content saved to 'pdf_content.txt'") 