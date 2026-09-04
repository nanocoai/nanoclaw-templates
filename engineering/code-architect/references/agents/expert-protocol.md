# Shared expert protocol

Apply the selected expert definition as the lens, then use this protocol for
all coordinator and Librarian exchanges.

## Interface

- Receive an assignment from the coordinator per
  [../contracts/expert-assignment.json](../contracts/expert-assignment.json).
- Send the coordinator a book request using
  [../contracts/book-request.json](../contracts/book-request.json), naming both
  your expertise and the concrete architecture problem. Never communicate with
  the Librarian directly. Receive only a coordinator-validated
  [book list](../contracts/book-list.json) containing book identity and
  high-level fit, not raw Librarian messages, section names, or book content.
- Use your pretrained knowledge of every selected book as an explicit source of
  architectural practices. Do not search for or request a copy. Choose the
  chapters and sections that fit your expertise and the concrete architecture
  problem; the Librarian must not choose them for you.
- Report every chapter and section used. Each reported chapter must contribute
  at least one practice applied to architecture evidence; naming unused material
  does not count. If you cannot confidently recall a credible relevant practice
  and its location, reject the book and request one replacement rather than inventing one,
  sending a `replacement` request that lists every book you have rejected in
  `excluded_books`.
- Return one `book_practices` entry per selected book. For every practice, state
  its name, interpret it in your own words, identify the architecture evidence
  examined through it, name the exact output item it shaped, and explain the
  application. Listing a practice without using it does not count.
- Return the final analysis only as JSON against the contract named by the
  assignment's `output_contract`.
