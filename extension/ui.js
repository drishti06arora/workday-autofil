// UI layer: button and user interactions
// Orchestrates extraction and agent calls

const BUTTON_ID = 'workday-autofill-extract-button';

const createFloatingButton = () => {
  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.textContent = 'Extract Workday Fields';
  button.style.position = 'fixed';
  button.style.bottom = '24px';
  button.style.left = '24px';
  button.style.padding = '12px 16px';
  button.style.zIndex = '999999';
  button.style.border = '1px solid rgba(255,255,255,0.18)';
  button.style.borderRadius = '999px';
  button.style.background = 'rgba(0,0,0,0.88)';
  button.style.color = '#e5e7eb';
  button.style.fontSize = '14px';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 14px 38px rgba(0,0,0,0.25)';
  button.style.backdropFilter = 'blur(10px)';
  button.style.pointerEvents = 'auto';
  button.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
  button.style.opacity = '0.95';

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.opacity = '1';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.opacity = '0.95';
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Loading...';

    try {
      // Extract fields
      const fields = await extractWorkdayFields();
      console.log('Extracted Workday fields:', fields);

      if (!fields.length) {
        button.textContent = 'No fields found';
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
        return;
      }

      // Send to agent
      button.textContent = 'Autofilling...';
      const agentResponse = await sendFieldsToAgent(fields);
      console.log('Agent response:', agentResponse);

      // Apply fills
      const filled = fillFields(agentResponse.fills || {});
      console.log('Fields filled:', filled);

      button.textContent = filled ? 'Autofill complete' : 'No fillable fields';
    } catch (error) {
      console.error('Autofill failed:', error);
      button.textContent = 'Agent unavailable';
    }

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1800);
  });

  document.body.appendChild(button);
};

const setupNavigationWatcher = () => {
  const patchHistoryMethod = (methodName) => {
    const original = history[methodName];
    history[methodName] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(createFloatingButton, 200);
      return result;
    };
  };

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', () => setTimeout(createFloatingButton, 200));
};
