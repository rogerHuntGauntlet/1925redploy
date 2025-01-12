export default function Status() {
  return (
    <article>
      <h1>System Status</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Check the current status of ChatGenius services and view any ongoing incidents.
      </p>

      <div className="space-y-8">
        <section>
          <h2>Current Status</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>All Systems Operational</span>
            </div>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </section>

        <section>
          <h2>Service Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Core Messaging</span>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
            <div className="flex justify-between items-center">
              <span>Authentication</span>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
            <div className="flex justify-between items-center">
              <span>File Storage</span>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
            <div className="flex justify-between items-center">
              <span>Search</span>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
            <div className="flex justify-between items-center">
              <span>API</span>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </section>

        <section>
          <h2>Recent Incidents</h2>
          <p className="text-gray-600">No incidents reported in the last 24 hours.</p>
        </section>

        <section>
          <h2>Scheduled Maintenance</h2>
          <p className="text-gray-600">No scheduled maintenance at this time.</p>
        </section>

        <section>
          <h2>Status Updates</h2>
          <p className="mb-4">Stay informed about our system status:</p>
          <ul className="space-y-2">
            <li>Follow @ChatGeniusStatus on Twitter</li>
            <li>Subscribe to our status page RSS feed</li>
            <li>Join our status notification mailing list</li>
          </ul>
        </section>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        For immediate assistance with technical issues, please contact our support team.
      </p>
    </article>
  );
} 