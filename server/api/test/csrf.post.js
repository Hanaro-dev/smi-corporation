/**
 * CSRF Protection Test Endpoint
 * This endpoint can be used to verify that CSRF protection is working correctly
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  return {
    success: true,
    message: 'CSRF protection is working correctly!',
    timestamp: new Date().toISOString(),
    receivedData: body,
    csrfToken: event.context.csrfToken || 'No CSRF token in context',
    headers: {
      'x-xsrf-token': getHeader(event, 'x-xsrf-token') || 'No X-XSRF-TOKEN header',
      'cookie': getHeader(event, 'cookie') || 'No cookies'
    }
  };
});