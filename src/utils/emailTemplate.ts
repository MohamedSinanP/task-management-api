export const generateEmailTemplate = (title: string, content: string) => {
  return `
    <div style="
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 30px;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      ">
        <!-- Header -->
        <div style="
          background-color: #007bff;
          color: white;
          padding: 15px 20px;
          text-align: center;
          font-size: 20px;
          font-weight: bold;
        ">
          Task Management System
        </div>

        <!-- Main Content -->
        <div style="padding: 20px;">
          <h2 style="color: #333;">${title}</h2>
          <div style="color: #555; font-size: 15px; line-height: 1.6;">
            ${content}
          </div>
        </div>

        <!-- Footer -->
        <div style="
          background: #f0f0f0;
          text-align: center;
          padding: 10px;
          color: #777;
          font-size: 13px;
        ">
          © ${new Date().getFullYear()} Task Management System. All rights reserved.
        </div>
      </div>
    </div>
  `;
};
