#!/bin/bash
file="app/components/developer/FormsValidationGuide.vue"

# Add missing closing div before section endings
sed -i '
/<!-- Manual Validation Pattern -->/,/<!-- UForm Component Pattern -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- UForm Component Pattern -->/,/<!-- Form Submission Patterns -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Form Submission Patterns -->/,/<!-- Error Display Patterns -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Error Display Patterns -->/,/<!-- Loading States -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Loading States -->/,/<!-- Cancel Confirmation -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Cancel Confirmation -->/,/<!-- Form State Management -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Form State Management -->/,/<!-- Field-Specific Patterns -->/ {
  s|      </section>|      </div>\n    </section>|
}
/<!-- Field-Specific Patterns -->/,/<!-- Best Practices Summary -->/ {
  s|      </section>|      </div>\n    </section>|
}
' "$file"

echo "Fixed section endings"
